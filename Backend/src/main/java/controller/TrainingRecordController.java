package com.example.demo.controller;

import com.example.demo.model.TrainingRecord;
import com.example.demo.repository.TrainingRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "*")
public class TrainingRecordController {

    @Autowired
    private TrainingRecordRepository repository;

    @GetMapping
    public List<TrainingRecord> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public TrainingRecord create(@RequestBody TrainingRecord record) {
        return repository.save(record);
    }

    @PutMapping("/{id}")
    public TrainingRecord update(@PathVariable Long id, @RequestBody TrainingRecord recordDetails) {
        TrainingRecord record = repository.findById(id).orElseThrow();
        record.setStatus(recordDetails.getStatus());
        record.setProgress(recordDetails.getProgress());
        return repository.save(record);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}